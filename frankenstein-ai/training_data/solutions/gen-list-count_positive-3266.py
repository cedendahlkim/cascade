# Task: gen-list-count_positive-3266 | Score: 100% | 2026-02-13T11:09:05.641092

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))