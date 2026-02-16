# Task: gen-strv-anagram-8940 | Score: 100% | 2026-02-12T19:28:45.116715

def solve():
    s1 = input().lower().replace(" ", "")
    s2 = input().lower().replace(" ", "")
    
    if sorted(s1) == sorted(s2):
        print("yes")
    else:
        print("no")

solve()