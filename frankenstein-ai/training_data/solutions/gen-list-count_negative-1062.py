# Task: gen-list-count_negative-1062 | Score: 100% | 2026-02-13T14:01:33.651859

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))