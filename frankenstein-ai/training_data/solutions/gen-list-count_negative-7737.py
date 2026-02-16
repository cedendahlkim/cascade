# Task: gen-list-count_negative-7737 | Score: 100% | 2026-02-13T13:42:27.474701

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))