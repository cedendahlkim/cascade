# Task: gen-pattern-pyramid-5248 | Score: 100% | 2026-02-13T21:27:55.663186

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))