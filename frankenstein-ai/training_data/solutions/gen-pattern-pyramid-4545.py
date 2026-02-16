# Task: gen-pattern-pyramid-4545 | Score: 100% | 2026-02-13T19:15:01.758065

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))