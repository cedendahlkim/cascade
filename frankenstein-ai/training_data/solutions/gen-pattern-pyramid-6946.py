# Task: gen-pattern-pyramid-6946 | Score: 100% | 2026-02-13T12:43:01.242015

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))