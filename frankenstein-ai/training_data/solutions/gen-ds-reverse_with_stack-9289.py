# Task: gen-ds-reverse_with_stack-9289 | Score: 100% | 2026-02-13T09:51:06.331635

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))