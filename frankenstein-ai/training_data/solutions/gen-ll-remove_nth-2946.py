# Task: gen-ll-remove_nth-2946 | Score: 100% | 2026-02-15T08:25:01.136658

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))