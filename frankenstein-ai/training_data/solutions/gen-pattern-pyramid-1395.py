# Task: gen-pattern-pyramid-1395 | Score: 100% | 2026-02-15T11:37:22.179184

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))