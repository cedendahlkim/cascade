# Task: gen-dp-climb_stairs-9588 | Score: 100% | 2026-02-13T12:35:27.261943

n = int(input())
if n <= 1:
    print(1)
else:
    a, b = 1, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    print(b)