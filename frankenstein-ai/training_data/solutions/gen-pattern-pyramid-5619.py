# Task: gen-pattern-pyramid-5619 | Score: 100% | 2026-02-13T09:42:33.868762

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))