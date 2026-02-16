# Task: gen-ds-reverse_with_stack-9751 | Score: 100% | 2026-02-15T09:16:42.234635

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))