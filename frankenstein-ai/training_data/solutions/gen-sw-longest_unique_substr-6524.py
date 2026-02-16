# Task: gen-sw-longest_unique_substr-6524 | Score: 100% | 2026-02-13T20:50:02.056207

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