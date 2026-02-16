# Task: gen-list-count_negative-6288 | Score: 100% | 2026-02-13T11:27:20.529259

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))