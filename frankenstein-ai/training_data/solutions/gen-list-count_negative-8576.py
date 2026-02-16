# Task: gen-list-count_negative-8576 | Score: 100% | 2026-02-13T16:48:11.415699

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))