from fastapi import APIRouter, HTTPException, status, Depends
from backend.app.database import get_db
from backend.app.schemas import UserRegisterRequest, UserLoginRequest, AuthTokenResponse, UserResponse
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthTokenResponse)
def register_user(payload: UserRegisterRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (payload.username, payload.email))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered"
            )
        
        pwd_hash, salt = hash_password(payload.password)
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, salt, full_name, role)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (payload.username, payload.email, pwd_hash, salt, payload.full_name, payload.role)
        )
        user_id = cursor.lastrowid
        
        cursor.execute("SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?", (user_id,))
        user_row = dict(cursor.fetchone())
        
        token = create_access_token(user_id=user_id, username=user_row["username"], role=user_row["role"])
        return AuthTokenResponse(token=token, user=UserResponse(**user_row))

@router.post("/login", response_model=AuthTokenResponse)
def login_user(payload: UserLoginRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, email, password_hash, salt, full_name, role, created_at FROM users WHERE username = ? OR email = ?",
            (payload.username, payload.username)
        )
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        user_dict = dict(user_row)
        if not verify_password(payload.password, user_dict["password_hash"], user_dict["salt"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        token = create_access_token(user_id=user_dict["id"], username=user_dict["username"], role=user_dict["role"])
        del user_dict["password_hash"]
        del user_dict["salt"]
        return AuthTokenResponse(token=token, user=UserResponse(**user_dict))

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@router.get("/demo-users")
def get_demo_users():
    """Returns demo credentials and instant tokens for 1-click role switching during hackathon evaluation."""
    tokens = {}
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, full_name, role, created_at FROM users WHERE username IN ('citizen', 'fixer', 'admin')")
        users = [dict(r) for r in cursor.fetchall()]
        
        for u in users:
            tokens[u["role"]] = {
                "token": create_access_token(u["id"], u["username"], u["role"]),
                "user": u
            }
    return tokens
