# Task: gen-dp-climb_stairs-5863 | Score: 100% | 2026-02-15T10:51:19.765768

n = int(input())
if n <= 1:
    print(1)
else:
    a, b = 1, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    print(b)