# Task: gen-strv-anagram-3564 | Score: 100% | 2026-02-12T12:16:56.065064

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