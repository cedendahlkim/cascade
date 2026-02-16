# Task: gen-strv-anagram-3762 | Score: 100% | 2026-02-12T13:28:42.274798

def solve():
    s1 = input().lower().replace(" ", "")
    s2 = input().lower().replace(" ", "")
    
    if sorted(s1) == sorted(s2):
        print("yes")
    else:
        print("no")

solve()