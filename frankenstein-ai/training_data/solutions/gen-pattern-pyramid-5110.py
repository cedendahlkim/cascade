# Task: gen-pattern-pyramid-5110 | Score: 100% | 2026-02-13T14:19:08.229019

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))