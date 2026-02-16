# Task: gen-ds-reverse_with_stack-9362 | Score: 100% | 2026-02-14T12:37:11.791280

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))