# Task: gen-dp-climb_stairs-8297 | Score: 100% | 2026-02-13T13:43:14.007368

n = int(input())
if n <= 1:
    print(1)
else:
    a, b = 1, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    print(b)