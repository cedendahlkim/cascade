# Task: gen-sw-longest_unique_substr-6489 | Score: 100% | 2026-02-13T18:51:12.517391

def solve():
    s = input()
    n = len(s)
    max_len = 0
    for i in range(n):
        for j in range(i, n):
            sub = s[i:j+1]
            if len(set(sub)) == len(sub):
                max_len = max(max_len, len(sub))
    print(max_len)

solve()