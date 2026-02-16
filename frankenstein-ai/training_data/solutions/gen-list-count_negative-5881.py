# Task: gen-list-count_negative-5881 | Score: 100% | 2026-02-13T11:35:21.116711

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))