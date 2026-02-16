# Task: gen-list-count_negative-5971 | Score: 100% | 2026-02-13T18:39:52.042984

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))