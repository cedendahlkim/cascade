# Task: gen-strv-anagram-8330 | Score: 100% | 2026-02-12T19:57:59.389681

def solve():
    s1 = input().lower().replace(" ", "")
    s2 = input().lower().replace(" ", "")
    
    if sorted(s1) == sorted(s2):
        print("yes")
    else:
        print("no")

solve()