# Task: gen-pattern-pyramid-6627 | Score: 100% | 2026-02-13T18:52:02.996240

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))