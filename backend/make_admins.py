import sqlite3
import os

def make_admins():
    db_path = os.path.join(os.path.dirname(__file__), 'products.db')
    print(f"Connecting to database at {db_path}...")
    
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()
        
        # The emails that should be upgraded to admin
        admin_emails = ["zqu001@mt.feitian.edu", "wymdbq555@gmail.com"]
        
        for email in admin_emails:
            # Check if user exists
            user = cursor.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            
            if user:
                cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
                print(f"✅ Successfully upgraded existing user {email} to admin!")
            else:
                # Force insert them as admin so they have it immediately upon first login
                cursor.execute(
                    "INSERT INTO users (email, name, role) VALUES (?, ?, ?)",
                    (email, email.split('@')[0], "admin")
                )
                print(f"✨ Successfully created new user {email} as admin!")
                
        connection.commit()
        print("Done!")
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    make_admins()
