# Task: gen-strv-anagram-5671 | Score: 100% | 2026-02-12T14:00:15.651905

def solve():
    s1 = input().lower().replace(" ", "")
    s2 = input().lower().replace(" ", "")
    
    if sorted(s1) == sorted(s2):
        print("yes")
    else:
        print("no")

solve()