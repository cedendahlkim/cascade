# Task: gen-pattern-pyramid-1090 | Score: 100% | 2026-02-15T11:13:27.647598

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))