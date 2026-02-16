# Task: gen-strv-anagram-6544 | Score: 100% | 2026-02-12T19:59:04.575743

def solve():
    s1 = input().lower().replace(" ", "")
    s2 = input().lower().replace(" ", "")
    
    if sorted(s1) == sorted(s2):
        print("yes")
    else:
        print("no")

solve()