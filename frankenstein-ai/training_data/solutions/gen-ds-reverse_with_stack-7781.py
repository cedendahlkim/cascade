# Task: gen-ds-reverse_with_stack-7781 | Score: 100% | 2026-02-14T12:28:35.096072

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))