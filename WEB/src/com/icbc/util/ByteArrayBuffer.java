/** DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 * 
 * Copyright 1997-2007 Sun Microsystems, Inc. All rights reserved.
 * 
 * The contents of this file are subject to the terms of either the GNU
 * General Public License Version 2 only ("GPL") or the Common Development
 * and Distribution License("CDDL") (collectively, the "License").  You
 * may not use this file except in compliance with the License. You can obtain
 * a copy of the License at https://glassfish.dev.java.net/public/CDDL+GPL.html
 * or glassfish/bootstrap/legal/LICENSE.txt.  See the License for the specific
 * language governing permissions and limitations under the License.
 * 
 * When distributing the software, include this License Header Notice in each
 * file and include the License file at glassfish/bootstrap/legal/LICENSE.txt.
 * Sun designates this particular file as subject to the "Classpath" exception
 * as provided by Sun in the GPL Version 2 section of the License file that
 * accompanied this code.  If applicable, add the following below the License
 * Header, with the fields enclosed by brackets [] replaced by your own
 * identifying information: "Portions Copyrighted [year]
 * [name of copyright owner]"
 * 
 * Contributor(s):
 * 
 * If you wish your version of this file to be governed by only the CDDL or
 * only the GPL Version 2, indicate your decision by adding "[Contributor]
 * elects to include this software in this distribution under the [CDDL or GPL
 * Version 2] license."  If you don't indicate a single choice of license, a
 * recipient has the option to distribute your version of this file under
 * either the CDDL, the GPL Version 2 or to extend the choice of license to
 * its licensees as provided above.  However, if you add GPL Version 2 code
 * and therefore, elected the GPL Version 2 license, then the option applies
 * only if the new code is made subject to such option by the copyright
 * holder.
 */

package com.icbc.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Serializable;

/**
 * Read/write buffer that stores a sequence of bytes.
 * 
 * <p>
 * It works in a way similar to {@link ByteArrayOutputStream} but this class
 * works better in the following ways:
 * 
 * <ol>
 * <li>no synchronization
 * <li>offers a {@link #newInputStream()} that creates a new {@link InputStream}
 * that won't cause buffer reallocation.
 * <li>less parameter correctness checking
 * <li>offers a {@link #write(InputStream)} method that reads the entirety of
 * the given {@link InputStream} without using a temporary buffer.
 * </ol>
 * 
 * @author Kohsuke Kawaguchi
 */
public class ByteArrayBuffer extends OutputStream implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 7870933204959661123L;

	/**
	 * The buffer where data is stored.
	 */
	protected byte[] buf;

	/**
	 * The number of valid bytes in the buffer.
	 */
	private int count;

	/**
	 * Creates a new byte array output stream. The buffer capacity is initially
	 * 32 bytes, though its size increases if necessary.
	 */
	public ByteArrayBuffer() {
		this(32);
	}

	public boolean setSize(int size) {
		if (size > count)
			return false;
		if (size < 0) {
			return false;
		}
		count = size;
		return true;
	}

	/**
	 * Creates a new byte array output stream, with a buffer capacity of the
	 * specified size, in bytes.
	 * 
	 * @param size
	 *            the initial size.
	 * @throws IllegalArgumentException
	 *             if size is negative.
	 */
	public ByteArrayBuffer(int size) {
		if (size <= 0)
			throw new IllegalArgumentException();
		buf = new byte[size];
	}

	public ByteArrayBuffer(byte[] data) {
		this.buf = data;
		// fix bug of new ByteArrayBuffer with byte[] data
		if (data != null)
			this.count = data.length;
	}

	/**
	 * Reads all the data of the given {@link InputStream} and appends them into
	 * this buffer.
	 * 
	 * @throws IOException
	 *             if the read operation fails with an {@link IOException}.
	 */
	public final void write(InputStream in) throws IOException {
		while (true) {
			int cap = buf.length - count; // the remaining buffer space
			int sz = in.read(buf, count, cap);
			if (sz < 0)
				return; // hit EOS
			count += sz;

			if (cap == sz)
				ensureCapacity(buf.length * 2); // buffer filled up.
		}
	}

	public final void write(int b) {
		int newcount = count + 1;
		ensureCapacity(newcount);
		buf[count] = (byte) b;
		count = newcount;
	}

	public final void write(byte b[], int off, int len) {
		int newcount = count + len;
		ensureCapacity(newcount);
		System.arraycopy(b, off, buf, count, len);
		count = newcount;
	}

	private void ensureCapacity(int newcount) {
		if (newcount > buf.length) {
			byte newbuf[] = new byte[Math.max(buf.length << 1, newcount)];
			System.arraycopy(buf, 0, newbuf, 0, count);
			buf = newbuf;
		}
	}

	public final void writeTo(OutputStream out) throws IOException {
		out.write(buf, 0, count);
	}

	public final void reset() {
		count = 0;
	}

	/**
	 * Gets the <b>copy</b> of exact-size byte[] that represents the written
	 * data.
	 * 
	 * <p>
	 * Since this method needs to allocate a new byte[], this method will be
	 * costly.
	 * 
	 * this method causes a buffer reallocation. Use it only when you have to.
	 */
	public final byte[] toByteArray() {
		byte newbuf[] = new byte[count];
		System.arraycopy(buf, 0, newbuf, 0, count);
		return newbuf;
	}

	public final int size() {
		return count;
	}

	/**
	 * Gets the underlying buffer that this {@link ByteArrayBuffer} uses. It's
	 * never small than its {@link #size()}.
	 * 
	 * Use with caution.
	 */
	public final byte[] getRawData() {
		return buf;
	}

	public void close() throws IOException {
	}

	/**
	 * Creates a new {@link InputStream} that reads from this buffer.
	 */
	public final InputStream newInputStream() {
		return new ByteArrayInputStream(buf, 0, count);
	}

	/**
	 * Creates a new {@link InputStream} that reads a part of this bfufer.
	 */
	public final InputStream newInputStream(int start, int length) {
		return new ByteArrayInputStream(buf, start, length);
	}

	/**
	 * Decodes the contents of this buffer by the default encoding and returns
	 * it as a string.
	 * 
	 * <p>
	 * Meant to aid debugging, but no more.
	 */
	public String toString() {
		return new String(buf, 0, count);
	}

	public boolean equals(Object obj) {
		if (obj == null)
			return false;
		if (obj.getClass() != ByteArrayBuffer.class)
			return false;
		return equals((ByteArrayBuffer) obj);
	}

	public boolean equals(ByteArrayBuffer buff) {
		if (buff == null)
			return false;
		if (buff.size() != this.size())
			return false;
		for (int i = 0; i < this.count; i++) {
			if (buff.getRawData()[i] != this.getRawData()[i]) {
				return false;
			}
		}
		return true;

	}

}