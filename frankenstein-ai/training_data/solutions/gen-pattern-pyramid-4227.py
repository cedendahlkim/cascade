# Task: gen-pattern-pyramid-4227 | Score: 100% | 2026-02-13T16:27:53.915744

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))