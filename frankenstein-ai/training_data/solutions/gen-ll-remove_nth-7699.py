# Task: gen-ll-remove_nth-7699 | Score: 100% | 2026-02-13T13:53:10.254068

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))