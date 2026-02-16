# Task: gen-pattern-pyramid-8177 | Score: 100% | 2026-02-14T12:28:10.885661

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))