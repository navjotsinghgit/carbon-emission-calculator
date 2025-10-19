from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str            # replaced EmailStr -> str to avoid email-validator
    password: str
    name: str | None = None
    role: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    email: str
    name: str | None = None
    role: str | None = None

    class Config:
        from_attributes = True