# Task: gen-list-count_negative-3187 | Score: 100% | 2026-02-14T13:12:27.849355

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))