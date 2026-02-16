# Task: gen-ll-remove_nth-6270 | Score: 100% | 2026-02-13T18:37:56.480699

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))