# Task: gen-ll-reverse_list-9510 | Score: 100% | 2026-02-15T07:49:44.939477

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))