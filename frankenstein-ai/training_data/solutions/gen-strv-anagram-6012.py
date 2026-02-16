# Task: gen-strv-anagram-6012 | Score: 100% | 2026-02-12T17:32:26.008673

def solve():
    s1 = input().strip().lower()
    s2 = input().strip().lower()

    s1 = s1.replace(" ", "")
    s2 = s2.replace(" ", "")

    if sorted(s1) == sorted(s2):
        print("yes")
    else:
        print("no")

solve()