package auth

import "testing"

func TestPasswordHash(t *testing.T) {
	encoded, err := hashPassword("long-demo-password")
	if err != nil {
		t.Fatal(err)
	}
	if !verifyPassword(encoded, "long-demo-password") {
		t.Fatal("correct password was rejected")
	}
	if verifyPassword(encoded, "wrong-password") || verifyPassword("invalid-hash", "long-demo-password") {
		t.Fatal("invalid password or hash was accepted")
	}
	second, err := hashPassword("long-demo-password")
	if err != nil {
		t.Fatal(err)
	}
	if second == encoded {
		t.Fatal("password salt was reused")
	}
}
