# Task: gen-ll-remove_nth-3785 | Score: 100% | 2026-02-15T07:49:44.095469

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))