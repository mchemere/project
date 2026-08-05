package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ---------------------------------------------------------------
// Models
// ---------------------------------------------------------------

type User struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Role         string `json:"role"`
	PasswordHash string `json:"-"`
	Status       string `json:"status"`
	Registered   string `json:"registered"`
}

type Landlord struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Verified bool   `json:"verified"`
}

type Property struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Type         string    `json:"type"`
	Price        int       `json:"price"`
	Bedrooms     int       `json:"bedrooms"`
	Bathrooms    int       `json:"bathrooms"`
	Size         string    `json:"size"`
	County       string    `json:"county"`
	Town         string    `json:"town"`
	Neighborhood string    `json:"neighborhood"`
	Address      string    `json:"address"`
	Location     string    `json:"location"`
	Status       string    `json:"status"`
	Approval     string    `json:"approval"`
	Amenities    []string  `json:"amenities"`
	Images       []string  `json:"images"`
	Landlord     Landlord  `json:"landlord"`
	Owner        string    `json:"owner"`
	CreatedAt    string    `json:"createdAt"`
}

type Inquiry struct {
	ID           int    `json:"id"`
	PropertyID   int    `json:"propertyId"`
	PropertyTitle string `json:"propertyTitle"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Message      string `json:"message"`
	CreatedAt    string `json:"createdAt"`
}

type Report struct {
	ID         int    `json:"id"`
	PropertyID int    `json:"propertyId"`
	Property   string `json:"property"`
	Reason     string `json:"reason"`
	Reporter   string `json:"reporter"`
	CreatedAt  string `json:"date"`
}

type FavoritesEntry struct {
	UserID     string `json:"-"`
	PropertyID int    `json:"propertyId"`
}

// ---------------------------------------------------------------
// Store
// ---------------------------------------------------------------

type Store struct {
	mu         sync.RWMutex
	users      []User
	properties []Property
	inquiries  []Inquiry
	reports    []Report
	favorites  []FavoritesEntry
	tokens     map[string]string // token -> userID
	nextPropID int
	nextInqID  int
	nextRepID  int
}

func newStore() *Store {
	now := func() string { return time.Now().Format(time.RFC3339) }
	s := &Store{
		users:      []User{},
		properties: []Property{},
		inquiries:  []Inquiry{},
		reports:    []Report{},
		tokens:     map[string]string{},
		nextPropID: 8,
		nextInqID:  1,
		nextRepID:  4,
	}

	s.users = append(s.users,
		User{
			ID:           "u-tenant",
			Name:         "Jane Njeri",
			Email:        "tenant@rentke.co.ke",
			Phone:        "0712345678",
			Role:         "tenant",
			PasswordHash: hashPassword("tenant123"),
			Status:       "Active",
			Registered:   "2026-06-15",
		},
		User{
			ID:           "u-landlord",
			Name:         "Peter Kimani",
			Email:        "landlord@rentke.co.ke",
			Phone:        "0723456789",
			Role:         "landlord",
			PasswordHash: hashPassword("landlord123"),
			Status:       "Active",
			Registered:   "2026-05-28",
		},
	)

	houseImg := "/frontend/css/assets/images/house.jpg"
	desc := "A spacious property with modern finishes, secure access, and a location ideal for professionals, couples, and growing families."
	baseAmenities := []string{"Parking", "Water", "Electricity", "Security", "Wi-Fi", "Balcony", "Garden"}

	mk := func(id int, title, location, county, town, neighborhood, typ string, price, beds, baths int, status, approval string) Property {
		return Property{
			ID: id, Title: title, Location: location, Type: typ,
			Price: price, Bedrooms: beds, Bathrooms: baths,
			County: county, Town: town, Neighborhood: neighborhood,
			Address: "123 Example Road", Size: "1200 sq ft",
			Status: status, Approval: approval,
			Description: desc, Amenities: baseAmenities,
			Images: []string{houseImg},
			Owner:  "Peter Kimani",
			Landlord: Landlord{
				Name: "Mary Wanjiku", Phone: "0722123456",
				Email: "mary.wanjiku@rentke.co.ke", Verified: true,
			},
			CreatedAt: now(),
		}
	}

	s.properties = append(s.properties,
		mk(1, "Modern 2 Bedroom Apartment", "Kisumu, Kenya", "Kisumu", "Kisumu Town", "Mamboleo", "Apartment", 25000, 2, 1, "available", "approved"),
		mk(2, "Cozy Family House", "Nairobi, Kenya", "Nairobi", "Westlands", "Kileleshwa", "House", 42000, 3, 2, "available", "approved"),
		mk(3, "Beachside Studio", "Mombasa, Kenya", "Mombasa", "Mombasa", "Nyali", "Studio", 18000, 1, 1, "available", "approved"),
		mk(4, "Affordable 1 Bedroom Unit", "Nakuru, Kenya", "Nakuru", "Nakuru Town", "Milimani", "Apartment", 15500, 1, 1, "available", "pending"),
		mk(5, "Luxury 3 Bedroom Home", "Eldoret, Kenya", "Uasin Gishu", "Eldoret", "Kapsoya", "House", 36000, 3, 2, "available", "approved"),
		mk(6, "City Center Loft", "Nairobi, Kenya", "Nairobi", "Nairobi", "CBD", "Apartment", 30000, 2, 2, "rented", "rejected"),
		mk(7, "Garden Villa", "Kisumu, Kenya", "Kisumu", "Kisumu Town", "Milimani", "House", 50000, 4, 3, "available", "pending"),
	)

	return s
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

var (
	emailRe = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	phoneRe = regexp.MustCompile(`^[0-9]{10}$`)
)

func hashPassword(password string) string {
	sum := sha256.Sum256([]byte("rentke-salt::" + password))
	return hex.EncodeToString(sum[:])
}

func randomToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func newID(prefix string) string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return prefix + "-" + hex.EncodeToString(b)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// bearerUserID extracts the user ID from the Authorization header.
func (s *Store) bearerUserID(r *http.Request) string {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return ""
	}
	token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if token == "" {
		return ""
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.tokens[token]
}

func (s *Store) findProperty(id int) (Property, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, p := range s.properties {
		if p.ID == id {
			return p, true
		}
	}
	return Property{}, false
}

func (s *Store) findUserByEmail(email string) (User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.users {
		if strings.EqualFold(u.Email, email) {
			return u, true
		}
	}
	return User{}, false
}

func (s *Store) findUser(id string) (User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.users {
		if u.ID == id {
			return u, true
		}
	}
	return User{}, false
}

func parseID(w http.ResponseWriter, r *http.Request, name string) (int, bool) {
	raw := r.PathValue(name)
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "Invalid id.")
		return 0, false
	}
	return id, true
}

// ---------------------------------------------------------------
// Auth handlers
// ---------------------------------------------------------------

func (s *Store) handleRegister(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body.")
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Email = strings.TrimSpace(body.Email)
	body.Phone = strings.TrimSpace(body.Phone)
	body.Role = strings.ToLower(strings.TrimSpace(body.Role))

	if body.Name == "" || body.Email == "" || body.Phone == "" || body.Password == "" || body.Role == "" {
		writeError(w, http.StatusBadRequest, "All fields are required.")
		return
	}
	if !emailRe.MatchString(body.Email) {
		writeError(w, http.StatusBadRequest, "Please use a valid email address.")
		return
	}
	if !phoneRe.MatchString(body.Phone) {
		writeError(w, http.StatusBadRequest, "Phone number must be exactly 10 digits.")
		return
	}
	if len(body.Password) < 8 {
		writeError(w, http.StatusBadRequest, "Password must be at least 8 characters long.")
		return
	}
	if body.Role != "tenant" && body.Role != "landlord" {
		writeError(w, http.StatusBadRequest, "Account type must be tenant or landlord.")
		return
	}
	if _, exists := s.findUserByEmail(body.Email); exists {
		writeError(w, http.StatusConflict, "An account with this email already exists.")
		return
	}

	user := User{
		ID:           newID("u"),
		Name:         body.Name,
		Email:        strings.ToLower(body.Email),
		Phone:        body.Phone,
		Role:         body.Role,
		PasswordHash: hashPassword(body.Password),
		Status:       "Active",
		Registered:   time.Now().Format("2006-01-02"),
	}

	s.mu.Lock()
	s.users = append(s.users, user)
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, map[string]string{
		"message": "Account created successfully. Please login.",
		"userId":  user.ID,
	})
}

func (s *Store) handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body.")
		return
	}
	if body.Email == "" || body.Password == "" {
		writeError(w, http.StatusBadRequest, "Email and password are required.")
		return
	}

	user, ok := s.findUserByEmail(body.Email)
	if !ok || user.PasswordHash != hashPassword(body.Password) {
		writeError(w, http.StatusUnauthorized, "Invalid email or password.")
		return
	}

	token := randomToken()
	s.mu.Lock()
	s.tokens[token] = user.ID
	s.mu.Unlock()

	writeJSON(w, http.StatusOK, map[string]any{
		"token": token,
		"user": map[string]any{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"phone": user.Phone,
			"role":  user.Role,
		},
	})
}

// ---------------------------------------------------------------
// Property handlers
// ---------------------------------------------------------------

func (s *Store) handleListProperties(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	list := make([]Property, len(s.properties))
	copy(list, s.properties)
	s.mu.RUnlock()
	writeJSON(w, http.StatusOK, list)
}

func (s *Store) handleGetProperty(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	p, found := s.findProperty(id)
	if !found {
		writeError(w, http.StatusNotFound, "Property not found.")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (s *Store) handleCreateProperty(w http.ResponseWriter, r *http.Request) {
	var body Property
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body.")
		return
	}

	body.Title = strings.TrimSpace(body.Title)
	body.County = strings.TrimSpace(body.County)
	body.Town = strings.TrimSpace(body.Town)
	body.Neighborhood = strings.TrimSpace(body.Neighborhood)
	if body.Title == "" || body.County == "" || body.Town == "" {
		writeError(w, http.StatusBadRequest, "Title, county and town are required.")
		return
	}
	if body.Price <= 0 {
		writeError(w, http.StatusBadRequest, "Monthly rent must be greater than zero.")
		return
	}
	if body.Type == "" {
		body.Type = "Apartment"
	}
	if body.Status == "" {
		body.Status = "available"
	}
	if body.Approval == "" {
		body.Approval = "pending"
	}
	if body.Location == "" {
		body.Location = fmt.Sprintf("%s, %s", body.Town, body.County)
	}
	if len(body.Images) == 0 {
		body.Images = []string{"/frontend/css/assets/images/house.jpg"}
	}

	userID := s.bearerUserID(r)
	if userID != "" {
		if u, ok := s.findUser(userID); ok {
			body.Owner = u.Name
		}
	}
	if body.Owner == "" {
		body.Owner = "Unverified Landlord"
	}
	if body.Landlord.Name == "" {
		body.Landlord.Name = body.Owner
	}

	s.mu.Lock()
	body.ID = s.nextPropID
	s.nextPropID++
	body.CreatedAt = time.Now().Format(time.RFC3339)
	s.properties = append(s.properties, body)
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, body)
}

func (s *Store) handleUpdateProperty(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var body Property
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body.")
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	for i, p := range s.properties {
		if p.ID == id {
			if body.Title != "" {
				p.Title = body.Title
			}
			if body.Type != "" {
				p.Type = body.Type
			}
			if body.County != "" {
				p.County = body.County
			}
			if body.Town != "" {
				p.Town = body.Town
			}
			if body.Neighborhood != "" {
				p.Neighborhood = body.Neighborhood
			}
			if body.Address != "" {
				p.Address = body.Address
			}
			if body.Description != "" {
				p.Description = body.Description
			}
			if body.Size != "" {
				p.Size = body.Size
			}
			if body.Price > 0 {
				p.Price = body.Price
			}
			if body.Bedrooms > 0 {
				p.Bedrooms = body.Bedrooms
			}
			if body.Bathrooms > 0 {
				p.Bathrooms = body.Bathrooms
			}
			if body.Status != "" {
				p.Status = body.Status
			}
			if body.Approval != "" {
				p.Approval = body.Approval
			}
			if body.Amenities != nil {
				p.Amenities = body.Amenities
			}
			s.properties[i] = p
			writeJSON(w, http.StatusOK, p)
			return
		}
	}
	writeError(w, http.StatusNotFound, "Property not found.")
}

func (s *Store) handleDeleteProperty(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	for i, p := range s.properties {
		if p.ID == id {
			s.properties = append(s.properties[:i], s.properties[i+1:]...)
			writeJSON(w, http.StatusOK, map[string]string{
				"message": "Property deleted successfully.",
			})
			return
		}
	}
	writeError(w, http.StatusNotFound, "Property not found.")
}

// ---------------------------------------------------------------
// Favorites handlers
// ---------------------------------------------------------------

func (s *Store) handleListFavorites(w http.ResponseWriter, r *http.Request) {
	userID := s.bearerUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "Authentication required.")
		return
	}

	s.mu.RLock()
	favs := []int{}
	for _, f := range s.favoritesOfUserLocked(userID) {
		favs = append(favs, f)
	}
	var list []Property
	for _, p := range s.properties {
		for _, fav := range favs {
			if p.ID == fav {
				list = append(list, p)
			}
		}
	}
	s.mu.RUnlock()

	writeJSON(w, http.StatusOK, list)
}

// favoritesOfUserLocked reads favorite property IDs for a user (RLock held).
func (s *Store) favoritesOfUserLocked(userID string) []int {
	ids := []int{}
	for _, f := range s.favorites {
		if f.UserID == userID {
			ids = append(ids, f.PropertyID)
		}
	}
	return ids
}

func (s *Store) handleAddFavorite(w http.ResponseWriter, r *http.Request) {
	userID := s.bearerUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "Authentication required.")
		return
	}
	var body struct {
		PropertyID int `json:"propertyId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.PropertyID <= 0 {
		writeError(w, http.StatusBadRequest, "propertyId is required.")
		return
	}
	if _, ok := s.findProperty(body.PropertyID); !ok {
		writeError(w, http.StatusNotFound, "Property not found.")
		return
	}

	s.mu.Lock()
	for _, f := range s.favorites {
		if f.UserID == userID && f.PropertyID == body.PropertyID {
			s.mu.Unlock()
			writeJSON(w, http.StatusOK, map[string]string{"message": "Already in favorites."})
			return
		}
	}
	s.favorites = append(s.favorites, FavoritesEntry{UserID: userID, PropertyID: body.PropertyID})
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, map[string]string{"message": "Property saved to favorites."})
}

func (s *Store) handleDeleteFavorite(w http.ResponseWriter, r *http.Request) {
	userID := s.bearerUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "Authentication required.")
		return
	}
	propertyID, ok := parseID(w, r, "propertyID")
	if !ok {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	for i, f := range s.favorites {
		if f.UserID == userID && f.PropertyID == propertyID {
			s.favorites = append(s.favorites[:i], s.favorites[i+1:]...)
			writeJSON(w, http.StatusOK, map[string]string{"message": "Removed from favorites."})
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Not in favorites."})
}

// ---------------------------------------------------------------
// Inquiries & reports
// ---------------------------------------------------------------

func (s *Store) handleCreateInquiry(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PropertyID int    `json:"propertyId"`
		Name       string `json:"name"`
		Email      string `json:"email"`
		Phone      string `json:"phone"`
		Message    string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body.")
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	body.Email = strings.TrimSpace(body.Email)
	body.Message = strings.TrimSpace(body.Message)

	if body.PropertyID <= 0 {
		writeError(w, http.StatusBadRequest, "propertyId is required.")
		return
	}
	p, ok := s.findProperty(body.PropertyID)
	if !ok {
		writeError(w, http.StatusNotFound, "Property not found.")
		return
	}
	if body.Name == "" || !emailRe.MatchString(body.Email) {
		writeError(w, http.StatusBadRequest, "A valid name and email are required.")
		return
	}
	if body.Message == "" {
		body.Message = "Hi, I would like to arrange a viewing for this property."
	}

	s.mu.Lock()
	inq := Inquiry{
		ID:            s.nextInqID,
		PropertyID:    body.PropertyID,
		PropertyTitle: p.Title,
		Name:          body.Name,
		Email:         body.Email,
		Phone:         body.Phone,
		Message:       body.Message,
		CreatedAt:     time.Now().Format(time.RFC3339),
	}
	s.nextInqID++
	s.inquiries = append(s.inquiries, inq)
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, map[string]string{
		"message": fmt.Sprintf("Your inquiry about %q has been sent to the landlord.", p.Title),
	})
}

func (s *Store) handleListInquiries(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	list := make([]Inquiry, len(s.inquiries))
	copy(list, s.inquiries)
	s.mu.RUnlock()
	writeJSON(w, http.StatusOK, list)
}

func (s *Store) handleCreateReport(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PropertyID int    `json:"propertyId"`
		Reason     string `json:"reason"`
		Reporter   string `json:"reporter"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body.")
		return
	}
	if body.PropertyID <= 0 {
		writeError(w, http.StatusBadRequest, "propertyId is required.")
		return
	}
	p, ok := s.findProperty(body.PropertyID)
	if !ok {
		writeError(w, http.StatusNotFound, "Property not found.")
		return
	}
	if body.Reason == "" {
		body.Reason = "Other"
	}
	if body.Reporter == "" {
		body.Reporter = "Anonymous"
	}

	s.mu.Lock()
	rep := Report{
		ID:         s.nextRepID,
		PropertyID: body.PropertyID,
		Property:   p.Title,
		Reason:     body.Reason,
		Reporter:   body.Reporter,
		CreatedAt:  time.Now().Format("2006-01-02"),
	}
	s.nextRepID++
	s.reports = append(s.reports, rep)
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, map[string]string{
		"message": "Property reported. Our team will review it shortly.",
	})
}

func (s *Store) handleListReports(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	list := make([]Report, len(s.reports))
	copy(list, s.reports)
	s.mu.RUnlock()
	writeJSON(w, http.StatusOK, list)
}

// ---------------------------------------------------------------
// Admin helpers
// ---------------------------------------------------------------

func (s *Store) handleListUsers(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	list := make([]User, len(s.users))
	copy(list, s.users)
	s.mu.RUnlock()
	writeJSON(w, http.StatusOK, list)
}

func (s *Store) handleStats(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	totalUsers := len(s.users)
	totalProps := len(s.properties)
	active := 0
	pending := 0
	for _, p := range s.properties {
		if p.Status == "available" && p.Approval == "approved" {
			active++
		}
		if p.Approval == "pending" {
			pending++
		}
	}
	writeJSON(w, http.StatusOK, map[string]int{
		"totalUsers":        totalUsers,
		"totalProperties":   totalProps,
		"activeListings":    active,
		"pendingApprovals":  pending,
		"reportedListings":  len(s.reports),
		"totalInquiries":    len(s.inquiries),
	})
}

// ---------------------------------------------------------------
// Server
// ---------------------------------------------------------------

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	s := newStore()

	mux := http.NewServeMux()

	// API
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("POST /api/register", s.handleRegister)
	mux.HandleFunc("POST /api/login", s.handleLogin)

	mux.HandleFunc("GET /api/properties", s.handleListProperties)
	mux.HandleFunc("POST /api/properties", s.handleCreateProperty)
	mux.HandleFunc("GET /api/properties/{id}", s.handleGetProperty)
	mux.HandleFunc("PUT /api/properties/{id}", s.handleUpdateProperty)
	mux.HandleFunc("DELETE /api/properties/{id}", s.handleDeleteProperty)

	mux.HandleFunc("GET /api/favorites", s.handleListFavorites)
	mux.HandleFunc("POST /api/favorites", s.handleAddFavorite)
	mux.HandleFunc("DELETE /api/favorites/{propertyID}", s.handleDeleteFavorite)

	mux.HandleFunc("POST /api/inquiries", s.handleCreateInquiry)
	mux.HandleFunc("GET /api/inquiries", s.handleListInquiries)

	mux.HandleFunc("POST /api/reports", s.handleCreateReport)
	mux.HandleFunc("GET /api/reports", s.handleListReports)

	mux.HandleFunc("GET /api/users", s.handleListUsers)
	mux.HandleFunc("GET /api/admin/stats", s.handleStats)

	// Static site
	staticDir := os.Getenv("RENTKE_STATIC_DIR")
	if staticDir == "" {
		staticDir = "."
	}
	absStatic, err := filepath.Abs(staticDir)
	if err != nil {
		log.Fatalf("invalid static dir: %v", err)
	}
	mux.Handle("/", http.FileServer(http.Dir(absStatic)))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("RentKe Go API + static server running at http://localhost:%s", port)
	log.Printf("Serving static files from %s", absStatic)
	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
