# Task: gen-sys-ratelimit-4738 | Score: 100% | 2026-02-17T19:56:22.949421

def solve():
    max_requests, window_size = map(int, input().split())
    n = int(input())
    
    user_requests = {}
    
    for _ in range(n):
        timestamp, user = input().split()
        timestamp = int(timestamp)
        
        if user not in user_requests:
            user_requests[user] = []
        
        user_requests[user] = [t for t in user_requests[user] if t >= timestamp - window_size + 1]
        
        if len(user_requests[user]) < max_requests:
            print("ALLOW")
            user_requests[user].append(timestamp)
        else:
            print("DENY")

solve()