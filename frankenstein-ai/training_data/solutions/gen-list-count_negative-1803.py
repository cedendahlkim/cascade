# Task: gen-list-count_negative-1803 | Score: 100% | 2026-02-13T11:35:26.884116

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))