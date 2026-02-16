# Task: gen-ds-reverse_with_stack-2265 | Score: 100% | 2026-02-13T16:47:35.675693

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))