# Task: gen-list-count_negative-7377 | Score: 100% | 2026-02-13T09:34:39.910348

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))