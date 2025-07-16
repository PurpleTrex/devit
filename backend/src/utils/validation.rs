use regex::Regex;

pub fn is_valid_email(email: &str) -> bool {
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    email_regex.is_match(email)
}

pub fn is_valid_username(username: &str) -> bool {
    let username_regex = Regex::new(r"^[a-zA-Z0-9_-]{3,32}$").unwrap();
    username_regex.is_match(username)
}

pub fn is_valid_repository_name(name: &str) -> bool {
    let repo_regex = Regex::new(r"^[a-zA-Z0-9._-]{1,100}$").unwrap();
    repo_regex.is_match(name)
}
