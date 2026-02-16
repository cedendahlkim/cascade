# Task: gen-ll-reverse_list-2942 | Score: 100% | 2026-02-15T14:00:18.269847

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))