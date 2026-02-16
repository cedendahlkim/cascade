# Task: gen-ll-remove_nth-7182 | Score: 100% | 2026-02-13T15:11:08.557012

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))