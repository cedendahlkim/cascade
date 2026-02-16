# Task: gen-pattern-pyramid-4835 | Score: 100% | 2026-02-13T12:11:58.933799

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))